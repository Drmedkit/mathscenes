# lesson-ship.sh <slug> "<commit title>" "<status note>": test, voice, commit the topic files, mark live in STATUS, push
set -e
s=$1
cd "C:/Users/stelt/Claude code foler/mathscenes-lessons"
npx vitest run tests/lesson-$s.test.ts 2>&1 | grep -E "Tests |FAIL" | head -3
errs=$(npx tsc --noEmit -p tsconfig.json 2>&1 | grep -c "/$s/\|lessons/$s\.\|lesson-$s" || true)
echo "tsc errors in $s: $errs"
note="$3"
if python tools/lesson-voice.py $s > /tmp/voice-$s.log 2>&1; then tail -1 /tmp/voice-$s.log
else
  # no voice credits (or the API is down): ship silent, the page waits on no audio; voice later with lesson-voice.py
  grep -o "quota_exceeded\|HTTP [0-9]*" /tmp/voice-$s.log | head -1
  note="$note; VOICE PENDING"
fi
n=$(ls pages/lessons/$s/voice/*.mp3 | wc -l); echo "mp3: $n"
git add src/lesson/topics/$s pages/lessons/$s.html pages/lessons/$s.ts pages/lessons/$s tests/lesson-$s.test.ts tools/walk-$s.mjs 2>/dev/null
git commit -q -m "Topic: $2

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
python tools/lesson-status.py $s live "$note" 
git add docs/lessons pages/lessons/topics.json
git commit -q -m "STATUS: $s live

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -q origin main
git log --oneline -1
