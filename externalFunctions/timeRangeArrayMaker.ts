// 自作パッケージのインポート
import {currentTimeReadable, unixTimeReadable} from "@ethereum_net_stats/readable_time";

// 型定義のインポート
import type {timeRangeArray} from "../types/types";

// 関数"timeRangeArrayMaker"の宣言
export const timeRangeArrayMaker = (endTimeOfCalculatedData: number, endTimeOfBaseData: number, durationInSec: number): timeRangeArray => {

    // 戻り値の変数の宣言
    let arrayOfTimeRange: timeRangeArray;

    // データベースの最後の集計データの集計開始時間を代入
    const START_RANGE_TIME_OF_LAST_ADDRESS_LIST_TIME: number = endTimeOfBaseData - (endTimeOfBaseData % durationInSec);

    // 次の集計期間の開始時間と終了時間を格納する変数の宣言
    let NEXT_START_TIME: number;
    let NEXT_END_TIME: number;

    // データベースが空の場合、イーサリアムネットワークのジェネシスタイムを使用して開始時間と終了時間の初期値を設定
    if (endTimeOfCalculatedData === 0) {

        const GENESIS_TIME: number = 1438269988;

        // 週間データの集計期間を月曜日基準に補正するための定数を定義（unix timeは木曜日の０時が開始基準のため）
        const THURSDAY_TO_MONDAY_SEC: number = 60 * 60 * 24 * 3;

        // ジェネシスブロックの生成時間を含む最初の集計期間の開始時間と終了時間を定義
        const GENESIS_START_RANGE: number = GENESIS_TIME - (GENESIS_TIME % durationInSec) - THURSDAY_TO_MONDAY_SEC;
        const GENESIS_END_RANGE: number = GENESIS_START_RANGE + durationInSec;
        console.log(`${currentTimeReadable()} | The weekly address count table is empty. The counting from the genesis block.`);
        console.log(`${currentTimeReadable()} | GENESIS_START_RANGE : ${unixTimeReadable(GENESIS_START_RANGE)} | GENESIS_END_RANGE : ${unixTimeReadable(GENESIS_END_RANGE)}`);
        NEXT_END_TIME = GENESIS_END_RANGE;
        NEXT_START_TIME = NEXT_END_TIME - durationInSec;

    } else {

        // データベースが空でない場合は、データベースの集計データの最終時間をもとに次の集計開始時間と終了時間を設定
        NEXT_START_TIME = endTimeOfCalculatedData;
        NEXT_END_TIME = NEXT_START_TIME + durationInSec;

    }

    // データベースに記録済のデータから最新のデータを記録するまでに必要な集計期間の長さに応じて戻り値の配列の要素数を決定
    let arrayLength: number = Math.floor((START_RANGE_TIME_OF_LAST_ADDRESS_LIST_TIME - NEXT_START_TIME) / durationInSec);

    if (arrayLength > 2) {
        // 配列の要素数が３以上の場合、Arrayオブジェクトのメソッドを使用して各集計期間を示すオブジェクトを配列の要素として設定
        arrayOfTimeRange = Array.from(Array(arrayLength).keys(), (x) => {
            return {
                startTime: NEXT_START_TIME + (x * durationInSec),
                endTime: NEXT_END_TIME + (x * durationInSec),
            }
        });
    } else if (arrayLength === 1) {
        // 配列の要素数が１の場合は、NEXT_START_TIMEとNEXT_END_TIMEを直接使用して集計期間を示すオブジェクトを配列の要素として設定
        arrayOfTimeRange = [{
            startTime: NEXT_START_TIME,
            endTime: NEXT_END_TIME,
        }];
    } else if (endTimeOfBaseData - endTimeOfCalculatedData <= 0) {
        // 配列の要素数が０以下の場合は、空配列を戻り値に代入
        arrayOfTimeRange = [];
    } else {
        // 上記のいずれにも該当しない場合は、空配列を戻り値に代入
        arrayOfTimeRange = [];
    }

    return arrayOfTimeRange;
}
