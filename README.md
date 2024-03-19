# M4: Distributed Storage
> Full name: `Ford McDonald`
> Email:  `ford_mcdonald@brown.edu`
> Username:  `fmcdona4`

## Summary
My implementation comprises `5` new software components, totaling `~500` added lines of code over the previous implementation. Key challenges included:

1. **Ensuring Consistency Across Distributed Nodes**: Making sure that data remains consistent across nodes when changes occur was challenging. I solved this by implementing the `reconf` method to carefully manage the relocation of data during node addition or removal.
2. **Error Handling in Asynchronous Operations**: Dealing with potential errors in asynchronous file and network operations required careful thought. I addressed this by adding comprehensive error handling and logging to trace and rectify issues as they arose.
3. **Performance Optimization**: Initially, the system had lower than expected performance. I profiled the application to identify bottlenecks and optimized critical paths by reducing unnecessary file operations and improving hashing efficiency.

## Correctness & Performance Characterization
*Correctness*: I wrote `0` tests to cover the core functionalities and edge cases; these tests take `--` to execute.

*Performance*: Storing and retrieving 1000 5-property objects using a 3-node setup results in the following average throughput and latency characteristics: `150 obj/sec` and `6.67 ms/object`. (Note: these objects were pre-generated in memory to avoid accounting for any performance overheads of generating these objects between experiments).

## Key Feature
The `reconf` method is designed to first identify all the keys to be relocated and then relocate individual objects instead of fetching all objects immediately and then pushing them to their corresponding locations. This approach minimizes the amount of data in transit at any given time and reduces the risk of data loss or corruption during the reconfiguration process. By focusing on keys rather than the objects themselves, the system can efficiently manage the relocation process even under high load or in cases where objects are large.

## Time to Complete
Roughly, this milestone took me `15` hours to complete.