let SessionLoad = 1
let s:so_save = &g:so | let s:siso_save = &g:siso | setg so=0 siso=0 | setl so=-1 siso=-1
let v:this_session=expand("<sfile>:p")
silent only
silent tabonly
cd ~/Desktop/viewing-palace
if expand('%') == '' && !&modified && line('$') <= 1 && getline(1) == ''
  let s:wipebuf = bufnr('%')
endif
set shortmess=aoO
badd +0 src/server/VideoManager.js
badd +92 src/client/client.js
badd +1 src/client/VideoManager.js
badd +0 src/server/Timer.js
badd +1 src/server/server.js
badd +18 public/index.css
badd +11 public/index.html
badd +0 public/client.js
badd +0 package-lock.json
badd +28 package.json
badd +10 src/server/ServerTools.js
argglobal
%argdel
tabnew
tabnew
tabnew
tabnew
tabrewind
edit src/server/ServerTools.js
set splitbelow splitright
set nosplitbelow
set nosplitright
wincmd t
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
argglobal
balt src/server/ServerTools.js
setlocal fdm=marker
setlocal fde=0
setlocal fmr=<--,-->
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 21 - ((20 * winheight(0) + 18) / 36)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 21
normal! 0
lcd ~/Desktop/viewing-palace
tabnext
edit ~/Desktop/viewing-palace/src/server/server.js
set splitbelow splitright
set nosplitbelow
set nosplitright
wincmd t
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
argglobal
balt ~/Desktop/viewing-palace/src/server/server.js
setlocal fdm=marker
setlocal fde=0
setlocal fmr=<--,-->
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 36 - ((20 * winheight(0) + 18) / 36)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 36
normal! 0
lcd ~/Desktop/viewing-palace
tabnext
edit ~/Desktop/viewing-palace/public/index.css
set splitbelow splitright
set nosplitbelow
set nosplitright
wincmd t
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
argglobal
balt ~/Desktop/viewing-palace/public/index.css
setlocal fdm=marker
setlocal fde=0
setlocal fmr=<--,-->
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 9 - ((6 * winheight(0) + 18) / 36)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 9
normal! 0
lcd ~/Desktop/viewing-palace
tabnext
edit ~/Desktop/viewing-palace/src/client/client.js
set splitbelow splitright
set nosplitbelow
set nosplitright
wincmd t
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
argglobal
setlocal fdm=marker
setlocal fde=0
setlocal fmr=<--,-->
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 78 - ((9 * winheight(0) + 18) / 36)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 78
normal! 0
lcd ~/Desktop/viewing-palace
tabnext
edit ~/Desktop/viewing-palace/public/index.html
set splitbelow splitright
set nosplitbelow
set nosplitright
wincmd t
set winminheight=0
set winheight=1
set winminwidth=0
set winwidth=1
argglobal
balt ~/Desktop/viewing-palace/public/index.html
setlocal fdm=marker
setlocal fde=0
setlocal fmr=<--,-->
setlocal fdi=#
setlocal fdl=0
setlocal fml=1
setlocal fdn=20
setlocal fen
let s:l = 20 - ((19 * winheight(0) + 18) / 36)
if s:l < 1 | let s:l = 1 | endif
keepjumps exe s:l
normal! zt
keepjumps 20
normal! 0
lcd ~/Desktop/viewing-palace
tabnext 5
if exists('s:wipebuf') && len(win_findbuf(s:wipebuf)) == 0&& getbufvar(s:wipebuf, '&buftype') isnot# 'terminal'
  silent exe 'bwipe ' . s:wipebuf
endif
unlet! s:wipebuf
set winheight=1 winwidth=20 winminheight=1 winminwidth=1 shortmess=filnxtToOF
let s:sx = expand("<sfile>:p:r")."x.vim"
if filereadable(s:sx)
  exe "source " . fnameescape(s:sx)
endif
let &g:so = s:so_save | let &g:siso = s:siso_save
doautoall SessionLoadPost
unlet SessionLoad
" vim: set ft=vim :
