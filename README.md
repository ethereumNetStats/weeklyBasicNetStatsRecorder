# weeklyBasicNetStatsRecorderについて
weeklyBasicNetStatsRecorderは、[Geth](https://github.com/ethereum/go-ethereum)にアクセスし、
イーサリアムネットワークの統計情報をMySQLデータベースに記録します。  
weeklyBasicNetStatsRecorderは、Gethとの通信には[web3js](https://github.com/web3/web3.js)を使用し、その他の通信には[sokcet.io](https://socket.io/)を使用します。  
weeklyBasicNetStatsRecorderは、[blockDataRecorder](https://github.com/ethereumNetStats/blockDataRecorder)から`newBlockDataRecorded`イベントを[socketServer](https://github.com/ethereumNetStats/socketServer)を介して受け取ったときに集計処理を開始し、集計結果をデータベースに記録し、記録が完了したことを`weeklyBasicNetStatsRecorded`イベントでsocketServerに通知します。  
**なお、weeklyBasicNetStatsRecorderは、[minutelyBasicNetStatsRecorder](https://github.com/ethereumNetStats/minutelyBasicNetStatsRecorder)の集計期間を示す変数`DURATION`を変更しただけのものです。**  

# 事前準備
[blockDataRecorder](https://github.com/ethereumNetStats/blockDataRecorder)のDockerのインストール〜ソースコードの実行までを完了して
Gethの運用とMySQLのDBテーブル`blockData`の生成までを完了して下さい。  
また、ethereumNetStatsのバックエンドは[socketServer](https://github.com/ethereumNetStats/socketServer)を介してそれぞれのプログラムがデータをやりとりします。したがってsocketServerを稼働させて下さい。  
プログラムの内容のみを知りたい場合はソースコードを参照ください。

### ソースコード
- メイン：[weeklyBasicNetStatsRecorder.ts](https://github.com/ethereumNetStats/weeklyBasicNetStatsRecorder/blob/main/weeklyBasicNetStatsRecorder.ts)
- 外部関数：[timeRangeArrayMaker.ts](https://github.com/ethereumNetStats/weeklyBasicNetStatsRecorder/blob/main/externalFunctions/timeRangeArrayMaker.ts)
- 外部関数：[recordBasicNetStats.ts](https://github.com/ethereumNetStats/weeklyBasicNetStatsRecorder/blob/main/externalFunctions/recordBasicNetStats.ts)

## 使い方
以下では、ubuntu server v22.04での使用例を説明します。  
まず、[blockDataRecorder](https://github.com/ethereumNetStats/blockDataRecorder)の説明で作成したデータベースに、以下のクエリを発行して集計データを記録するテーブルを作成します。
```mysql
CREATE TABLE `ethereum.weeklyBasicNetStats` (
                                       `startTimeReadable` varchar(19) NOT NULL,
                                       `endTimeReadable` varchar(19) NOT NULL,
                                       `startTimeUnix` int NOT NULL,
                                       `endTimeUnix` int NOT NULL,
                                       `actualStartTimeUnix` int NOT NULL,
                                       `actualEndTimeUnix` int NOT NULL,
                                       `startBlockNumber` int NOT NULL,
                                       `endBlockNumber` int NOT NULL,
                                       `blocks` int DEFAULT NULL,
                                       `totalBlockSize` int DEFAULT NULL,
                                       `averageBlockSize` float DEFAULT NULL,
                                       `blockSizePerBlock` float DEFAULT NULL,
                                       `totalDifficulty` varchar(64) DEFAULT NULL,
                                       `averageDifficulty` varchar(64) DEFAULT NULL,
                                       `difficultyPerBlock` varchar(64) DEFAULT NULL,
                                       `totalUncleDifficulty` varchar(64) DEFAULT NULL,
                                       `averageUncleDifficulty` varchar(64) DEFAULT NULL,
                                       `uncleDifficultyPerBlock` varchar(64) DEFAULT NULL,
                                       `totalNumberOfUncleBlocks` int DEFAULT NULL,
                                       `averageNumberOfUncleBlocks` float DEFAULT NULL,
                                       `numberOfUncleBlocksPerBlock` float DEFAULT NULL,
                                       `hashRate` float DEFAULT NULL,
                                       `totalTransactions` int DEFAULT NULL,
                                       `averageTransactions` float DEFAULT NULL,
                                       `transactionsPerBlock` float DEFAULT NULL,
                                       `totalBaseFeePerGas` float DEFAULT NULL,
                                       `averageBaseFeePerGas` float DEFAULT NULL,
                                       `baseFeePerGasPerBlock` float DEFAULT NULL,
                                       `totalGasUsed` float DEFAULT NULL,
                                       `averageGasUsed` float DEFAULT NULL,
                                       `gasUsedPerBlock` float DEFAULT NULL,
                                       `noRecordFlag` tinyint(1) DEFAULT NULL,
                                       KEY `minutelyBasicNetStats_endTimeUnix_index` (`endTimeUnix`),
                                       KEY `minutelyBasicNetStats_startTimeUnix_index` (`startTimeUnix`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
```
次にこのレポジトリを`clone`します。
```shell
git clone https://github.com/ethereumNetStats/weeklyBasicNetStatsRecorder.git
```
クローンしたディレクトリ内にある`.envSample`ファイルの`MYSQL_USER`と`MYSQL_PASS`を編集します。  
[blockDataRecorder](https://github.com/ethereumNetStats/blockDataRecorder)の手順通りにMySQLコンテナを立ち上げた場合は`MYSQL_USER=root`、`MYSQL_PASS`は起動時に指定したパスワードになります。  
`.envSample`
```
GETH_LAN_HTTP_API_ADDRESS=http://127.0.0.1:8545
GETH_LAN_SOCKET_API_ADDRESS=ws://127.0.0.1:8546

MYSQL_LAN_ADDRESS=127.0.0.1
MYSQL_PORT=3308
MYSQL_USER=******
MYSQL_PASS=******

SOCKET_SERVER_ADDRESS=ws://127.0.0.1:6000
```
`.envSample`の編集が終わったらファイル名を`.env`にリネームして下さい。
```shell
mv ./.envSample ./.env 
```
`.env`の編集が終わったら関連パッケージのインストールをします。
```shell
npm install
```
関連パッケージのインストールが終わったらTypescriptソースを下記コマンドでコンパイルします。
```shell
tsc --project tsconfig.json
```
コンパイルが終わったらDockerイメージをビルドしてコンテナを起動するためにシェルスクリプト`buildAndRunDockerImage.sh`に実行権限を付与します。
```shell
chmod 755 ./buildAndRunDockerImage.sh
```
最後にシェルスクリプトを実行してDockerコンテナを起動します。
```shell
sudo ./buildAndRunDockerImage.sh
```
