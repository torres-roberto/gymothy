#!/bin/bash
export $(grep -v '^#' .env | xargs)
npm install
npm start 