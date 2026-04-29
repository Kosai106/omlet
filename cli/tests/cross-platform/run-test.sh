#!/bin/bash

set -ex

base_repo_dir=~/omlet-test-repos
json_file=$1
repo_download_dir=${2:-~/omlet-github-downloads}

mkdir -p $base_repo_dir
mkdir -p $repo_download_dir

# realpath is not a portable command. This function is a workaround for that.
unrealpath() {
    # Check if the file or directory exists
    if [[ ! -e $1 ]]; then
        echo "realpath: $1: No such file or directory"
        return 1
    fi

    # Use readlink if available and applicable
    if readlink -f "$1" >/dev/null 2>&1; then
        readlink -f "$1"
    else
        # Fallback approach
        local dir file
        dir=$(dirname "$1")
        file=$(basename "$1")
        # Change to the directory and use pwd to print the absolute path
        (cd "$dir" && echo "$(pwd -P)/$file")
    fi
}

setup_repo() {
    repo_path=$1

    pushd $repo_path
    git init .
    git config core.autocrlf false  # core.autocrlf='false' needed for Windows since it tries to converts LF to CRLF
    git config core.longpaths true  # core.longpaths='true' needed for Windows since it doesn't support long paths
    git config user.name "Omlet Test"
    git config user.email "omlet-test@omlet.local"
    git add .
    git commit -m 'Initial commit'
    popd
}

# Check if a file path is provided
if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <path_to_json_file> [path_to_download_dir]"
    exit 1
fi

base_name=$(basename "$json_file" .json)

# Read repo URL from JSON
repo_url=$(jq -r '.repo' "$json_file")
commit=$(jq -r '.commit' "$json_file")
if [ -z "$repo_url" ]; then
    echo "Repository URL not found in the JSON file."
    exit 1
fi

# Clone the repository
echo "Downloading $repo_url into $base_name..."
repo_path=$base_repo_dir/$base_name
tarball_path=$repo_download_dir/$base_name-$commit.tar.gz

mkdir -p $repo_path
if [ ! -f "$tarball_path" ]; then
    curl -L "$repo_url/archive/$commit.tar.gz" -o "$tarball_path"
fi
tar -xzf $tarball_path -C $repo_path

# Tarball contains a single directory with the repo name (org/repo) and commit hash as the name
repo_path=$repo_path/*
setup_repo $repo_path

# Check if the config field exists and is not null
if jq -e '.config' "$json_file" &> /dev/null; then
    # Extract config data and save it to .omletrc.json in the repo directory
    jq '.config' "$json_file" > "${base_name}/.omletrc.json"
    if [ $? -ne 0 ]; then
        echo "Failed to extract config data."
        exit 1
    fi
    echo "Config data extracted to config.json."
fi

echo "Repository setup completed successfully."

# Run the CLI
script_dir=$(unrealpath $(dirname "$0"))
cli_path=$(unrealpath "$script_dir/../../bin/omlet")

echo "Running CLI on the repository..."
pushd $repo_path
$cli_path analyze --dry-run
popd
