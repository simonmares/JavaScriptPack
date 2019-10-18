#!/usr/bin/env bash

perl -p -i -e "s/\<scope\>.*\<\/scope\>/\<scope\>source.js,source.ts,source.tsx\<\/scope\>/g" `ag --case-sensitive --files-with-matches "<scope>"`
