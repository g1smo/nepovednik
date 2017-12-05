#!/bin/bash

for i in $(seq 1 1000); do
  if [ ! -e nepovedi/$i.mp4 ] || [ ! -e nepovedi/$i.webm ]; then
    echo $i
  fi
done
