if [ $# -lt 1 ]; then
  echo "Usage $0 <version>"
  exit
fi

version="$1"

npm run build
zipname=tabexport_"$version".zip
7z a -tzip "$zipname" ./build/*

mkdir releases/"$version" 2>/dev/null
mv "$zipname" releases/"$version"

echo
echo "Release $version: releases/$version/$zipname"
