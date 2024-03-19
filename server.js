const http = require("http");

// Model 會使用大寫 Room
const Room = require("./models/room");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: "./config.env" });

// console.log(process.env.PORT);

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

// 連接資料庫
mongoose
  .connect(DB)
  .then(() => {
    console.log("資料庫連線成功");
  })
  .catch((err) => {
    console.log(err);
  });

// 處理請求
const requestListener = async (req, res) => {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
  });

  const headers = {
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Content-Length, X-Requested-With",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "PATCH,OPTIONS, POST, GET,DELETE",
    "Content-Type": "application/json",
  };
  if (req.url == "/rooms" && req.method == "GET") {
    // 取得所有資料, 使用非同步處理先撈到資料
    const rooms = await Room.find();
    res.writeHead(200, headers);
    res.write(
      JSON.stringify({
        status: "success",
        rooms,
      })
    );
    res.end();
  } else if (req.url == "/rooms" && req.method == "POST") {
    req.on("end", async () => {
      try {
        const data = JSON.parse(body);

        // 先打一筆確認資料有過來
        // console.log(data);

        // 加 await 等跑完再繼續往下
        const newRoom = await Room.create({
          name: data.name,
          price: data.price,
          rating: data.rating,
        });

        res.writeHead(200, headers);
        res.write(
          JSON.stringify({
            status: "success",
            rooms: newRoom, // newRoom,
          })
        );
        res.end();
      } catch (err) {
        res.writeHead(400, headers);
        res.write(
          JSON.stringify({
            status: "false",
            message: "欄位不正確，或沒有此 id",
            error: err,
          })
        );
        console.log(err);
        res.end();
      }
    });
  } else if (req.url == "/rooms" && req.method == "DELETE") {
    const rooms = await Room.deleteMany({}); // {} 刪除全部
    res.writeHead(200, headers);
    res.write(
      JSON.stringify({
        status: "success",
        rooms: [],
      })
    );
    res.end();
  } else if (req.url.startsWith("/rooms/") && req.method == "DELETE") {
    const id = req.url.split("/")[2];
    const rooms = await Room.findByIdAndDelete(id);
    if (rooms) {
      res.writeHead(200, headers);
      res.write(
        JSON.stringify({
          status: "success",
          message: "刪除單筆資料成功",
          rooms: rooms,
        })
      );
    } else {
      res.writeHead(404, headers);
      res.write(
        JSON.stringify({
          status: "error",
          message: "沒有找到該 id",
        })
      );
    }
    res.end();
  } else if (req.url.startsWith("/rooms/") && req.method == "PATCH") {
    req.on("end", async () => {
      try {
        const id = req.url.split("/")[2];
        const data = JSON.parse(body);

        const updatedRoom = await Room.findByIdAndUpdate(
          id,
          {
            name: data.name,
            price: data.price,
            rating: data.rating,
          },
          { new: true }
        ); // 返回更新後的文檔

        if (updatedRoom) {
          res.writeHead(200, headers);
          res.write(
            JSON.stringify({
              status: "success",
              message: "更新單筆資料成功",
              room: updatedRoom,
            })
          );
        } else {
          res.writeHead(404, headers);
          res.write(
            JSON.stringify({
              status: "error",
              message: "沒有找到該 id",
            })
          );
        }
        res.end();
      } catch {
        res.writeHead(400, headers);
        res.write(
          JSON.stringify({
            status: "error",
            message: "請求處理失敗",
            error: err.message,
          })
        );
        console.error(err);
        res.end();
      }
    });
  } else if (req.method == "OPTIONS") {
    res.writeHead(200, headers);
    res.end();
  } else {
    res.writeHead(404, headers);
    res.write(
      JSON.stringify({
        status: "false",
        message: "無此網站路由",
      })
    );
    res.end();
  }
};

const server = http.createServer(requestListener);
server.listen(process.env.PORT);
