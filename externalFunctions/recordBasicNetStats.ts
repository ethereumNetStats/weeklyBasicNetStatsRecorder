// パッケージのインポート
import {performance} from 'perf_hooks';

// 自作パッケージのインポート
import {getMysqlConnection} from "@ethereum_net_stats/get_mysql_connection";
import {gethDockerHttpClient} from "@ethereum_net_stats/get_geth_connections";
import {currentTimeReadable, unixTimeReadable} from "@ethereum_net_stats/readable_time";

// 型定義のインポート
import type {Socket} from "socket.io-client";
import type {timeRangeArray, basicNetStats} from "../types/types";
import type {ClientToServerEvents} from '../types/socketEvents';
import type {Pool, OkPacket, RowDataPacket} from "@ethereum_net_stats/get_mysql_connection";
import type {Block} from "web3-eth";

// MySQLとのプールコネクションを生成
let pool: Pool = getMysqlConnection(false, true);

// 関数"recordBasicNetStats"の宣言
export const recordBasicNetStats = async (timeRangeArray: timeRangeArray, socketClient: Socket<ClientToServerEvents>, recordTableName: string, durationInSec: number) => {
    console.log(`${currentTimeReadable()} | Start: Recording weekly basic net stats process.`);

    // 処理時間の計測開始
    let processStart: number = performance.now();

    // 引数として受け取った集計期間の配列から１つの集計期間を取り出し
    for (let timeRange of timeRangeArray) {

        // SQLクエリ用のオブジェクトの初期化
        let queryData: basicNetStats = {
            startTimeReadable: '',
            endTimeReadable: '',
            startTimeUnix: 0,
            endTimeUnix: 0,
            actualStartTimeUnix: 0,
            actualEndTimeUnix: 0,
            startBlockNumber: 0,
            endBlockNumber: 0,
            blocks: 0,
            totalBlockSize: 0,
            averageBlockSize: 0,
            blockSizePerBlock: 0,
            totalDifficulty: '',
            averageDifficulty: '',
            difficultyPerBlock: '',
            totalTransactions: 0,
            averageTransactions: 0,
            transactionsPerBlock: 0,
            totalBaseFeePerGas: 0,
            averageBaseFeePerGas: 0,
            baseFeePerGasPerBlock: 0,
            totalGasUsed: 0,
            averageGasUsed: 0,
            gasUsedPerBlock: 0,
            totalUncleDifficulty: '',
            averageUncleDifficulty: '',
            uncleDifficultyPerBlock: '',
            totalNumberOfUncleBlocks: 0,
            averageNumberOfUncleBlocks: 0,
            numberOfUncleBlocksPerBlock: 0,
            hashRate: 0,
            noRecordFlag: false,
        };

        // アンクルブロック格納用の配列の初期化
        let uncleBlockData: Array<Block> = [];

        // データベースから集計期間内のブロックデータを取得
        let [blockData] = await pool.query<RowDataPacket[]>(`SELECT *
                                                             FROM ethereum.blockData
                                                             WHERE timestamp >= ${timeRange.startTime} && timestamp < ${timeRange.endTime}`);

        // SQLクエリ用に集計期間を示す値を代入
        queryData.startTimeReadable = unixTimeReadable(Number(timeRange.startTime));
        queryData.endTimeReadable = unixTimeReadable(Number(timeRange.endTime));
        queryData.startTimeUnix = Number(timeRange.startTime);
        queryData.endTimeUnix = Number(timeRange.endTime);
        queryData.actualStartTimeUnix = blockData[0].timestamp;
        queryData.actualEndTimeUnix = blockData[blockData.length - 1].timestamp;
        queryData.startBlockNumber = blockData[0].number;
        queryData.endBlockNumber = blockData[blockData.length - 1].number;
        queryData.blocks = blockData.length;

        // 集計期間内に生成されたブロックがなければそのことを示すフラグを設定して記録
        if (blockData.length === 0) {
            console.log(`${currentTimeReadable()} | No data | Datetime : ${unixTimeReadable(queryData.startTimeUnix)} - ${unixTimeReadable(queryData.endTimeUnix)} | Message : This time range has no blocks. Record zero-data.`);
            queryData.noRecordFlag = true;
            await pool.query<OkPacket>(`INSERT INTO ${recordTableName}
                                        SET ?`, queryData);
            continue;
        }

        // 集計用の一時的な変数の宣言
        let tmpTotalDifficulty: number = 0;
        let tmpAverageDifficulty: number = 0;
        let tmpDifficultyPerBlock: number = 0;
        let tmpTotalUncleDifficulty: number = 0;
        let tmpAverageUncleDifficulty: number = 0;
        let tmpUncleDifficultyPerBlock: number = 0;

        // データベースから取得したブロックデータごとに値を取得して必要な集計を実行
        for (let block of blockData) {

            // アンクルブロックデータがある場合は、アンクルブロックデータを格納する
            if (block.uncles) {
                for (let i = 0; i < block.uncles.split(',').length; i++) {
                    uncleBlockData.push(await gethDockerHttpClient.getUncle(block.number, i));
                }
            }

            // 集計期間におけるトータルブロックサイズを計算
            if (block.size) {
                queryData.totalBlockSize += block.size;
            }

            // 集計期間におけるトータル難易度を計算
            if (block.difficulty) {
                tmpTotalDifficulty += Number(block.difficulty);
            }

            // 集計期間におけるトランザクション数を計算
            if (block.transactions) {
                queryData.totalTransactions += block.transactions.split(',').length;
            }

            // 集計期間におけるbaseFeePerGasを計算
            if (block.baseFeePerGas) {
                queryData.totalBaseFeePerGas += block.baseFeePerGas;
            }

            // 集計期間に消費されたガス代を計算
            if (block.gasUsed) {
                queryData.totalGasUsed += block.gasUsed;
            }
        }

        // 集計期間におけるブロックサイズの時間平均を計算
        queryData.averageBlockSize = queryData.totalBlockSize / durationInSec;

        // 集計期間におけるブロックサイズのブロック平均を計算
        queryData.blockSizePerBlock = queryData.totalBlockSize / queryData.blocks;

        // 集計期間における難易度の時間平均を計算
        tmpAverageDifficulty = tmpTotalDifficulty / durationInSec;

        // 集計期間における難易度のブロック平均を計算
        tmpDifficultyPerBlock = tmpTotalDifficulty / queryData.blocks;

        // 集計期間におけるトランザクション数の時間平均を計算
        queryData.averageTransactions = queryData.totalTransactions / durationInSec;

        // 集計期間におけるトランザクション数のブロック平均を計算
        queryData.transactionsPerBlock = queryData.totalTransactions / queryData.blocks;

        // 集計期間におけるbaseFeePerGasの時間平均を計算
        queryData.averageBaseFeePerGas = queryData.totalBaseFeePerGas / durationInSec;

        // 集計期間におけるbaseFeePerGasのブロック平均を計算
        queryData.baseFeePerGasPerBlock = queryData.totalBaseFeePerGas / queryData.blocks;

        // 集計期間におけるガス代の時間平均を計算
        queryData.averageGasUsed = queryData.totalGasUsed / durationInSec;

        // 集計期間におけるガス代のブロック平均を計算
        queryData.gasUsedPerBlock = queryData.totalGasUsed / queryData.blocks;

        // 集計対象のブロックデータにアンクルブロックが含まれる場合は、必要な集計を行う
        if (uncleBlockData.length > 0) {
            for (let uncleBlock of uncleBlockData) {
                if (uncleBlock) {
                    // 集計データに加えるアンクルブロックのトータル難易度を計算
                    tmpTotalUncleDifficulty += Number(uncleBlock.difficulty);
                }
            }

            // 集計期間におけるトータルアンクルブロック数を計算
            queryData.totalNumberOfUncleBlocks = uncleBlockData.length;

            // 集計期間におけるアンクルブロック数の時間平均を計算
            queryData.averageNumberOfUncleBlocks = queryData.totalNumberOfUncleBlocks / durationInSec;

            // 集計期間におけるアンクルブロック数のブロック平均を計算
            queryData.numberOfUncleBlocksPerBlock = queryData.totalNumberOfUncleBlocks / queryData.blocks;
        }

        // 集計期間におけるアンクルブロックのトータル難易度の時間平均を計算
        tmpAverageUncleDifficulty = tmpTotalUncleDifficulty / durationInSec;

        // 集計期間におけるアンクルブロックのトータル難易度のブロック平均を計算
        tmpUncleDifficultyPerBlock = tmpTotalUncleDifficulty / queryData.blocks;

        // 集計期間におけるハッシュレートを計算
        queryData.hashRate = (tmpTotalDifficulty + tmpTotalUncleDifficulty) / durationInSec;

        // MySQLのunsigned bigint型の上限を越える数値を文字列型に変換
        queryData.totalDifficulty = String(tmpTotalDifficulty);
        queryData.averageDifficulty = String(tmpAverageDifficulty);
        queryData.difficultyPerBlock = String(tmpDifficultyPerBlock);
        queryData.totalUncleDifficulty = String(tmpTotalUncleDifficulty);
        queryData.averageUncleDifficulty = String(tmpAverageUncleDifficulty);
        queryData.uncleDifficultyPerBlock = String(tmpUncleDifficultyPerBlock);

        // データベースに集計データを記録
        await pool.query<OkPacket>(`INSERT INTO ${recordTableName}
                                    SET ?`, queryData);
        console.log(`${currentTimeReadable()} | Insert : A weekly basic net stats. | Datetime : ${unixTimeReadable(queryData.startTimeUnix)} - ${unixTimeReadable(queryData.endTimeUnix)}`);

        // 集計データの記録をsocketServerに通知
        socketClient.emit('weeklyBasicNetStatsRecorded', queryData);
        console.log(`${currentTimeReadable()} | Emit : 'weeklyBasicNetStatsRecorded' | To : socketServer`);

    }

    // 処理時間の計測終了
    let processEnd: number = performance.now();
    console.log(`${currentTimeReadable()} | End : Recording weekly basic net stats process. | Process time : ${((processEnd - processStart) / 1000).toString().slice(0, -12)} sec.`);

}
