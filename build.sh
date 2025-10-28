#!/bin/bash
cd client
npm install
npm run build
cd ..
mkdir -p public
cp -r client/build/* public/
