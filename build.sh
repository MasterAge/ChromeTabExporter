if [ $# -lt 1 ]; then
  echo "Usage $0 <dotted-version>"
  echo "Example: $0 1.2.3"
  exit 1
fi

# Check version is dotted
# shellcheck disable=SC2046
if [ $(echo "$1" | grep -c  "[0-9]\+\.[0-9]\+\.[0-9]\+") -ne 1 ]; then
  echo "Error: Version must in the form: 1.2.3"
  exit 2
fi

version="$1"

# Check manifest has been updated
if [ $(grep "$version" public/manifest.json -c) -ne 1 ]; then
  echo "Error: public/manifest.json must be updated to $version"
  exit 3
fi

# Check package.json has been updated
if [ $( grep "\"version\"\: \"$version" package.json -c) -ne 1 ]; then
  echo "Error: package.json must be updated to $version"
  exit 4
fi

npm run build
zipname=tabexport_"$version".zip
7z a -tzip "$zipname" ./build/*

mkdir releases/"$version" 2>/dev/null
mv "$zipname" releases/"$version"

echo
echo "Release $version: releases/$version/$zipname"
