简易步骤：

1. 选择 Terminal 界面，选择合适的端口（一般是 COM3/COM7 本地测试/实验室环境），点击连接，观察右侧提示，若显示成功则当前步骤完成；

2. 选择 Picture 界面，端口一般选择 COM4/COM6（本地测试/实验室环境），同上操作；

3. 切换至 Terminal 界面，Terminal 栏下的

    - 输入框可输入单条命令：
    - Append 键添加一条待执行命令；
    - Clear 键清屏；
    - Send 键执行所有待执行命令；
    - Refresh 键更新输出。
    
   已执行的命令以 `>>>` 开头，单片机输出以 `<<<` 开头。

   可以先通过 `help` 查看连接情况，再使用第一条命令（`scrd_pic_lp_nc 4095 4095 4095 4095 ...`）开始快扫。

   其他参数用法可参照旧文档。

4. 切换至 Picture 界面，使用 Refresh 和 Update 键更新输出界面（十六进制格式和图片格式），Auto Refresh 每 0.5s 更新一次。

   当界面不再更新时扫描完成，使用 Export 键导出图片，默认存在用户的 Download 目录下，文件名为 `pic_<时间戳>.png`。

Tips：

1. 重启时需要点击 Picture->Clear 键，然后在 Terminal 界面的命令框内重新选中扫描命令，然后再依次点击 Append，Send 键，之后重复第四步。

2. Data format settings 并没有用。

3. 缺省值一般不用修改。Resolution 在 Terminal 界面的作用是设置扫描命令的分辨率，在 Picture 界面的作用是设置输出图片的大小。

本地部署方法：

1. 安装 Nodejs 环境 npm。

2. 终端内运行 `npm install` 安装依赖。

3. `npm start` 本地运行测试，`npm run make` 打包程序于 `./out/sem_frontend_nodejs-win32-x64` 下。
