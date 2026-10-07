#!/usr/bin/env python3
"""Terminal quiz for hiragana/katakana. Usage: python3 kana_quiz.py [hiragana|katakana|both] [rounds]"""
import random
import sys

ROMAJI = ("a i u e o ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no "
          "ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n").split()
HIRAGANA = list("あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん")
KATAKANA = list("アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン")


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "both"
    rounds = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    pool = []
    if mode in ("hiragana", "both"):
        pool += list(zip(HIRAGANA, ROMAJI))
    if mode in ("katakana", "both"):
        pool += list(zip(KATAKANA, ROMAJI))

    missed, score = [], 0
    for kana, romaji in random.sample(pool, min(rounds, len(pool))):
        answer = input(f"{kana}  -> ").strip().lower()
        if answer == romaji:
            score += 1
        else:
            print(f"   no: {romaji}")
            missed.append((kana, romaji))
    print(f"\nScore: {score}/{min(rounds, len(pool))}")
    if missed:
        print("Review:", " ".join(f"{k}={r}" for k, r in missed))


if __name__ == "__main__":
    main()
