# distributed-decision-log

## Setup:
* Clone https://github.com/NiklasJonsson6/PIVT-for-containerd to the root folder
* Fulfill requirements (https://github.com/NiklasJonsson6/PIVT-for-containerd#requirements)
* Make sure argo has the necessary permissions. 
  * The nice way: set up a service account with the required roles only
  * The rough way: argo runs in the default namespace with the default service account, just give it admin privileges (kubectl create rolebinding default-admin --clusterrole=admin --serviceaccount=default:default)
* Run PIVT-for-containerd/setup.sh
* Add the hosts in network-config/hostAliases.yaml to backend-node/backend.yaml .spec.template.spec
* Run backend-node/skaffold.sh