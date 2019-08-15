#!/bin/bash

# use \n in this strange manner and
# rm backup file .BAK so it works on both *nix and Mac Os
# could be a JS script but for now, it should be enough ;)
sed -i.BAK 's/\[Unreleased\]/\[Unreleased\]\
\
## \['$npm_package_version'\]/' CHANGELOG.md

rm CHANGELOG.md.BAK
