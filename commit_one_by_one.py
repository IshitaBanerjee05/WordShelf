import subprocess
import os
import time

def run_cmd(cmd):
    return subprocess.run(cmd, capture_output=True, text=True, cwd=r'd:\prog\WordShelf')

# Get modified and untracked files safely
res_m = run_cmd(['git', 'ls-files', '-m'])
res_o = run_cmd(['git', 'ls-files', '-o', '--exclude-standard'])

files = res_m.stdout.splitlines() + res_o.stdout.splitlines()
files = [f.strip() for f in files if f.strip()]
files = list(set(files))  # Deduplicate just in case

print(f"Found {len(files)} files to commit.")

for idx, file in enumerate(files, 1):
    print(f"[{idx}/{len(files)}] Committing: {file}")
    run_cmd(['git', 'add', file])
    
    # Check if there is anything to commit (in case the file is an empty directory or something)
    status_res = run_cmd(['git', 'status', '--porcelain'])
    if not status_res.stdout.strip():
        print(f"  -> Skipping {file}, nothing to commit.")
        continue
        
    msg = f"Update {os.path.basename(file)}"
    run_cmd(['git', 'commit', '-m', msg])
    
    # Push the commit
    push_res = run_cmd(['git', 'push'])
    if push_res.returncode == 0:
        print(f"  -> Successfully pushed {file}")
    else:
        print(f"  -> Failed to push {file}: \n{push_res.stderr}")
    
    time.sleep(1) # just to avoid hitting GitHub rate limits too fast
    
print("All files processed.")
