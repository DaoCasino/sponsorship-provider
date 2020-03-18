#Sponsorship provider
For DAOPlatform

##What is it
It is a nodejs server that receives serialized DAOBET transactions, adds sponsorship and signs them.

##How to use
First you need to build this


##Benchmark
This tool was benchmarked with apache benchmark. Configuration of machine was
- Intel Core i5 5257U
- 8gb ram

The transction to provide signature is a simple transfer transaction

Single-process mode:
- 782.99 requests/second

Multi-process mode (4 node processes, 20 benchmark threade):
- 847.76 requests/second
