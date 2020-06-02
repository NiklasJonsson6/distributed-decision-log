#!/bin/bash

if [ "$#" -ne 0 ]; then
   echo "no args allowed"
   exit 2
fi

# exit when any command fails
set -e

script_folder=./PIVT/fabric-kube/
cd $script_folder
project_folder=../../network-config/
chaincode_folder=../../chaincode/
# TODO fix the hardcoded relative paths...
current_folder=$(pwd)

echo "-- creating necessary stuff --"
./init.sh $project_folder $chaincode_folder

echo "-- Launch the Raft based Fabric network in broken state (only because of useActualDomains=true) --"
helm install hlf-kube ./hlf-kube -f $project_folder/network.yaml \
-f $project_folder/crypto-config.yaml \
--set orderer.cluster.enabled=true --set peer.launchPods=false --set orderer.launchPods=false

echo "-- collect the host aliases --"
./collect_host_aliases.sh $project_folder

echo "-- then update the network with host aliases --"
helm upgrade hlf-kube ./hlf-kube -f $project_folder/network.yaml -f $project_folder/crypto-config.yaml \
-f $project_folder/hostAliases.yaml --set orderer.cluster.enabled=true 

echo "-- waiting for all pods to start --"
kubectl wait --for condition=ready pods --all

echo "-- create the channel(s) --"
helm template channel-flow/ -f $project_folder/network.yaml -f $project_folder/crypto-config.yaml -f $project_folder/hostAliases.yaml | argo submit - --watch