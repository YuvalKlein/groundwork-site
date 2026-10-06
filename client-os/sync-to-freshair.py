"""Keep the dependency-free shared presentation identical in both deploys."""
from pathlib import Path
import argparse
p=argparse.ArgumentParser();p.add_argument('freshair_repo',type=Path);p.add_argument('--check',action='store_true');a=p.parse_args()
s=Path(__file__).with_name('improvement-view.js');d=a.freshair_repo/'web/public/groundwork/improvement-view.js'
if a.check:
 if not d.exists() or d.read_bytes()!=s.read_bytes():raise SystemExit('Groundwork presentation bundle differs')
 print('Shared presentation bundles match')
else:
 d.parent.mkdir(parents=True,exist_ok=True);d.write_bytes(s.read_bytes());print('Shared presentation synced')
