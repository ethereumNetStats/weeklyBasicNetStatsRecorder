type blockNumberWithTimestamp = {
    blockNumber: number | undefined,
    timestamp: number | undefined,
}

type timeRange = {
    startTime: number | string,
    endTime: number | string,
};

type timeRangeArray = Array<timeRange>;

type basicNetStats = {
    startTimeReadable: string,
    endTimeReadable: string,
    startTimeUnix: number,
    endTimeUnix: number,
    actualStartTimeUnix: number,
    actualEndTimeUnix: number,
    startBlockNumber: number,
    endBlockNumber: number,
    blocks: number,
    totalBlockSize: number,
    averageBlockSize: number,
    blockSizePerBlock: number,
    totalDifficulty: string,
    averageDifficulty: string,
    difficultyPerBlock: string,
    totalUncleDifficulty: string,
    averageUncleDifficulty: string,
    uncleDifficultyPerBlock: string,
    totalNumberOfUncleBlocks: number,
    averageNumberOfUncleBlocks: number,
    numberOfUncleBlocksPerBlock: number,
    hashRate: number,
    totalTransactions: number,
    averageTransactions: number,
    transactionsPerBlock: number,
    totalBaseFeePerGas: number,
    averageBaseFeePerGas: number,
    baseFeePerGasPerBlock: number,
    totalGasUsed: number,
    averageGasUsed: number,
    gasUsedPerBlock: number,
    noRecordFlag: boolean,
};

export {blockNumberWithTimestamp, timeRange, timeRangeArray, basicNetStats}
