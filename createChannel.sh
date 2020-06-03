#!/bin/bash

# TODO clean up unnecessary stuff
CHANNEL_NAME="$1"
DELAY="$2"
MAX_RETRY="$3"
VERBOSE="$4"
: ${CHANNEL_NAME:="meeting1"}
: ${DELAY:="3"}
: ${MAX_RETRY:="5"}
: ${VERBOSE:="false"}

# import utils
#. scripts/envVar.sh

#if [ ! -d "channel-artifacts" ]; then
	#mkdir channel-artifacts
#fi

# Use yq to parse yaml, network.channels gives an array, for now we only use one
config_file=./network-config/network.yaml
# TODO channels[0] should not be hardcorded
CHANNEL_NAME=$(yq '.network.channels[0].name' $config_file -r)
CHANNEL_ORGS=$(yq '.network.channels[0].orgs[]' $config_file -r)
# TODO more hardcorded stuff here...
ORDERER_CA=./network-config/crypto-config/ordererOrganizations/yoleanord.se/orderers/orderer0.yoleanord.se/msp/tlscacerts/tlsca.yoleanord.se-cert.pem

# Pass organizationName, peer#
setGlobals() {
	local MSP=${1}MSP #YoleanMSP / Yolean2MSP etc
	local USING_PEER=${2}

	local configtx_file=./network-config/configtx.yaml
	# crypto-config/peerOrganizations/yolean.se/msp
	local MSP_DIR=$(yq '.Organizations[] | select(.Name == "YoleanMSP") .MSPDir' $configtx_file -r)
	# should be done in some smarter way maybe, should work though unless cryptogen paths changes
	local USING_ORG=$(cut -d'/' -f 3 <<< $MSP_DIR)

	echo "Using organization(MSP) ${MSP}, peer ${USING_PEER}, org ${USING_ORG}"

	export CORE_PEER_LOCALMSPID=$MSP
	export CORE_PEER_TLS_ROOTCERT_FILE=./network-config/${MSP_DIR%/msp}/peers/peer${USING_PEER}.${USING_ORG}/tls/ca.crt
	export CORE_PEER_MSPCONFIGPATH=./network-config/${MSP_DIR%/msp}/users/Admin@${USING_ORG}/msp
	export CORE_PEER_ADDRESS=peer${USING_PEER}.${USING_ORG}:7051
}

createChannelTx() {

	set -x
	configtxgen -profile $CHANNEL_NAME -outputCreateChannelTx ./network-config/channel-artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME
	res=$?
	set +x
	if [ $res -ne 0 ]; then
		echo "Failed to generate channel configuration transaction..."
		exit 1
	fi
	echo

}

createAncorPeerTx() {
	for orgmsp in $CHANNEL_ORGS; do
		echo "#######    Generating anchor peer update for ${orgmsp}  ##########"
		set -x
		configtxgen -profile $CHANNEL_PROFILE -outputAnchorPeersUpdate .network-config/channel-artifacts/${orgmsp}anchors.tx -channelID $CHANNEL_NAME -asOrg ${orgmsp}
		res=$?
		set +x
		if [ $res -ne 0 ]; then
			echo "Failed to generate anchor peer update for ${orgmsp}..."
			exit 1
		fi
		echo
	done
}

createChannel() {
	local ordererAddress="orderer0.yoleanord.se:7050"

	# Should be fine for creaing the channel
	setGlobals Yolean 0
	# Poll in case the raft leader is not set yet
	local rc=1
	local COUNTER=1
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
		sleep $DELAY
		set -x

		# --ordererTLSHostnameOverride orderer.example.com ---- might be needed after -c ChannelName
		peer channel create -o $ordererAddress -c $CHANNEL_NAME -f .network-config/channel-artifacts/${CHANNEL_NAME}.tx \
		--outputBlock .network-config/channel-artifacts/${CHANNEL_NAME}.block --tls false --cafile $ORDERER_CA >&log.txt

		res=$?
		set +x
		let rc=$res
		COUNTER=$(expr $COUNTER + 1)
	done
	cat log.txt
	verifyResult $res "Channel creation failed"
	echo
	echo "===================== Channel '$CHANNEL_NAME' created ===================== "
	echo
}

# Change envs (setGlobals()) before calling
joinChannel() {
	local rc=1
	local COUNTER=1
	## Sometimes Join takes time, hence retry
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
    sleep $DELAY
    set -x
    peer channel join -b ./channel-artifacts/$CHANNEL_NAME.block >&log.txt
    res=$?
    set +x
		let rc=$res
		COUNTER=$(expr $COUNTER + 1)
	done
	cat log.txt
	echo
	verifyResult $res "After $MAX_RETRY attempts, peer0.org${ORG} has failed to join channel '$CHANNEL_NAME' "
}

updateAnchorPeers() {
  ORG=$1
  setGlobals $ORG
	local rc=1
	local COUNTER=1
	## Sometimes Join takes time, hence retry
	while [ $rc -ne 0 -a $COUNTER -lt $MAX_RETRY ] ; do
    sleep $DELAY
    set -x
		peer channel update -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com -c $CHANNEL_NAME -f ./channel-artifacts/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
    res=$?
    set +x
		let rc=$res
		COUNTER=$(expr $COUNTER + 1)
	done
	cat log.txt
  verifyResult $res "Anchor peer update failed"
  echo "===================== Anchor peers updated for org '$CORE_PEER_LOCALMSPID' on channel '$CHANNEL_NAME' ===================== "
  sleep $DELAY
  echo
}

verifyResult() {
  if [ $1 -ne 0 ]; then
    echo "!!!!!!!!!!!!!!! "$2" !!!!!!!!!!!!!!!!"
    echo
    exit 1
  fi
}

FABRIC_CFG_PATH=${PWD}/configtx

## Create channeltx
echo "### Generating channel configuration transaction '${CHANNEL_NAME}.tx' ###"
createChannelTx

## Create anchorpeertx
echo "### Generating channel configuration transaction '${CHANNEL_NAME}.tx' ###"
createAncorPeerTx

FABRIC_CFG_PATH=$PWD/../config/

## Create channel
echo "Creating channel "$CHANNEL_NAME
createChannel

# TODO join Yolean peer0/1 Yolean2 peer0/1 in some better way
for channelOrg in $CHANNEL_ORGS; do
	echo "#######    Joing ${channelOrg} peers to the channel... ##########"
	setGlobals $channelOrg 0
	joinChannel
	setGlobals $channelOrg 1
	joingChannel
done
## Join all the peers to the channel
#echo "Join Org1 peers to the channel..."
#joinChannel 1
#echo "Join Org2 peers to the channel..."
#joinChannel 2

# TODO below not yet changed
## Set the anchor peers for each org in the channel
echo "Updating anchor peers for org1..."
updateAnchorPeers 1
echo "Updating anchor peers for org2..."
updateAnchorPeers 2

echo
echo "========= Channel successfully joined =========== "
echo

exit 0
