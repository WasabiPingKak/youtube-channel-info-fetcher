#!/bin/bash

# 切換到 frontend 資料夾
cd "$(dirname "$0")/../frontend"

# 部署到 Firebase Hosting
firebase deploy --only hosting
