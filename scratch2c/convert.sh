#!/bin/bash

# EXAMPLE :
#  ./convert.sh 37043356 noel examples/ledStrip.config

ICI=$(cd $(dirname $0) ; /bin/pwd)
OUTDIR="$ICI/../data"

usage() {
	echo "Usage :"
	echo "$0 project_id project_name [config]"
	echo "  or"
	echo "$0 project_file [project_name] [config]"
	echo " project_file = existing scratch project file (json file)"
	echo " project_id = number in scratch editor url"
	echo " project_name = name you want for your project binary"
	echo "   If a project file is specified, defaults to file basename"
	echo " config = config file. Defaults to data/project_name.config"
	echo
	echo " env variables :"
	echo "   TARGET = destination device architecture (defaults to Uno)"
	echo "   DEVICE = serial device name (default to com5 or ttyACM0)"
	exit
}

if [ $# -lt 1 -o $# -gt 3 ] ; then
	usage
fi

if [ -f $1 ] ; then
	project_file="$1"
	if [ $# -eq 3 ] ; then
		project_name="$2"
		config="$3"
	elif [ $# -eq 2 ] ; then
		if [ -f $2 ] ; then
			config="$2"
		else
			project_name="$2"
		fi
	fi
else
	project_id=$1
	project_name="$2"
	if [ $# -eq 3 ] ; then
		config="$3"
	fi
fi

if [ -z "$project_name" ] ; then
	project_name="$(basename $project_file .json)"
fi
if [ -z "$config" ] ; then
	config="$OUTDIR/$project_name.config"
fi

echo "Project '$project_name' from '$project_id' / '$project_file' with '$config'"

# stop at first error
set -e

if [ -z "$project_file" ] ; then
	project_file="$OUTDIR/$project_name.json"
	# get project json file
	wget -O "$project_file" "http://projects.scratch.mit.edu/internalapi/project/$project_id/get/"
fi

# convert to cpp file
rm -f "$OUTDIR/$project_name.cpp"
make "$OUTDIR/$project_name.cpp" S2C_CONFIG="$config"

env=""
if -n "$UPLOAD_DEVICE" ; then
	env="$env UPLOAD_DEVICE=$UPLOAD_DEVICE"
fi
if -n "$TARGET" ; then
	env="$env TARGET=$TARGET"
else
	env="$env TARGET=Uno"
fi

rm -f "$ICI/target/*"
make MAIN_SOURCE="$OUTDIR/$project_name.cpp" MAIN_NAME="$project_name" TARGET=Uno console
