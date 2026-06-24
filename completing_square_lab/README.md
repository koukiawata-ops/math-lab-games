# 平方完成ステップラボ

このゲームは、`GAME_PUBLISHING_FLOW.md` の方針に従ってGitHub PagesでPublic公開する外部HTMLゲームです。

## 目的

高校数学Iの二次関数・式変形で使う平方完成を、穴埋め形式で素早く練習するMath Lab用ゲームです。

## ゲーム形式

- 1分間タイムアタック制
- 体力3
- ミスをすると体力が1減る
- 体力が0になるか、60秒が終わると終了
- 問題数は固定しない
- 数式はLaTeXをMathJaxで表示する
- 回答は平方完成後の2つの空欄に入る数を入力する
- 最大スコアはMath Lab標準に合わせて1000

## 回答形式

例:

```text
x^2 + 6x + 5 = (x + □)^2 + □
```

この場合は、以下を入力します。

```text
x の中: 3
外の数: -4
```

分数は `5/2`, `-21/4` のように入力します。

## 難易度

ゲーム画面では説明文を出さず、次の3つだけを表示します。

```text
初級
中級
上級
```

内部的な出題内容:

| レベル | 内容 |
| --- | --- |
| 初級 | `x^2 + bx + c`。整数で完成する問題と、分数が出る問題をランダムに出す |
| 中級 | `a(x + h)^2 + k` 型に整理できる基本整数問題と、初級問題をランダムに出す |
| 上級 | `ax^2 + bx + c`。aでくくったうえで分数になる問題も含め、ランダムに出す |

## Math Lab XP構成

ポータル側のXP計算は以下です。

```text
取得XP = max_xp * score_rate * BASE_XP_MULTIPLIER
       + CLEAR_BONUS_XP
       + difficulty_bonus
```

`score_rate` は `score / max_score` です。ゲーム側ではXPを直接決めず、スコアだけをMath Labへ返します。

## Gamesシート登録例

```text
game_id: completing_square_lab
title: 平方完成ステップラボ
course: 数学I
unit: 二次関数
category: 式変形
difficulty: 3
launch_url: 公開したゲームURL
launch_mode: new_tab
max_score: 1000
max_xp: 80
score_type: numeric
description: 平方完成の空欄を1分間で埋めるタイムアタックゲーム。
thumbnail_url:
enabled: TRUE
sort_order: 30
min_duration_sec: 30
```

## レベルカーブ

ユーザーレベルは固定XP刻みではなく、後半ほど必要XPが増える指数型です。

```text
次レベル必要XP = LEVEL_BASE_XP * LEVEL_XP_GROWTH_RATE^(現在レベル - 1)
```

初期設定:

```text
LEVEL_BASE_XP: 100
LEVEL_XP_GROWTH_RATE: 1.18
```
