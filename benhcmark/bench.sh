#!/bin/sh
ab -p data.json -T application/json -c 1 -n 2000 http://localhost:3000/sponsor
