const fish = document.getElementById("fish");
const fisher = document.getElementById("fisher");
const finish = document.getElementById("finish");

let progress = 0;
const maxProgress = 100;
const interval = setInterval(() => {
  if (progress < maxProgress) {
    progress += 4 + Math.random() * 6;
    const position = Math.min(progress, maxProgress);
    fish.style.left = `calc(${position}% - 40px)`; // 魚の中央を基準に調整
  } else {
    clearInterval(interval);
    fish.style.display = "none";
    fisher.style.display = "none";
    finish.style.display = "block";

    // 3秒後にウィンドウを閉じる
    setTimeout(() => {
      window.close();
    }, 3000);
  }
}, 200);
