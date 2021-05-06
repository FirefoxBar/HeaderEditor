#!/bin/bash

cd $TRAVIS_BUILD_DIR
npm run pack
npm run release