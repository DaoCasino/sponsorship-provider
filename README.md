# Sponsorship provider
For DAOPlatform

## What is it
It is a nodejs server that receives serialized DAOBET transactions, adds sponsorship and signs them.

## How to use
First, build with ```npm run build```.

Single-core mode: ```npm run start```

Multi-core mode: ```npm run cluster```

## Config
You can provide config using `config.json` file or via `SPONSOR_CONFIG` environment variable containing 
stringifyed json with config.

## :warning: Security Varning
Sponsorship provider signs transaction with provieded active keys!
Please use filters anytime you start this app!

## Benchmark
This tool was benchmarked with apache benchmark. Configuration of machine was
- Intel Core i5 5257U
- 8gb ram

The transction to provide signature is a simple transfer transaction

Single-process mode:
- 782.99 requests/second

Multi-process mode (4 node processes, 20 benchmark threade):
- 847.76 requests/second
