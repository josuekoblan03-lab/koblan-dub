"""Monte la vidéo de démo du site : titre → VO anglaise → même passage doublé en français → fin.

Chaque partie est rendue à part (mêmes réglages), puis les 4 sont assemblées sans réencodage :
un seul graphe FFmpeg pour tout gardait en mémoire les images des parties en attente (« Cannot allocate memory »).
Entrées dans « Koblan Dub - demo » ; sortie : assets/video/demo.mp4 + demo-affiche.jpg du site.
Usage : python -I outils/montage/monter_demo.py
"""
import pathlib
import subprocess

FFMPEG = r"C:\videotrans\ffmpeg\ffmpeg.exe"
DEMO = pathlib.Path(r"C:\Users\KOBLAN\Music\Koblan Dub - demo")
SITE = pathlib.Path(__file__).resolve().parents[2]
CARTES = DEMO / "montage"
VO = DEMO / "Demo - Frank Rubio NASA (anglais).mp4"
VF = DEMO / "FR" / "Demo - Frank Rubio NASA (anglais).mp4"
SORTIE = SITE / "assets" / "video" / "demo.mp4"
AFFICHE = SITE / "assets" / "video" / "demo-affiche.jpg"

T_TITRE, T_VO, T_VF, T_FIN = 3.0, 13.6, 17.6, 5.0   # raccords calés sur « …trois centimètres »
F = 0.4  # durée des fondus
ENCODAGE = ["-c:v", "libx264", "-preset", "slow", "-crf", "23", "-pix_fmt", "yuv420p", "-r", "30",
            "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2"]
FONDU_V = lambda d: f"fade=t=in:st=0:d={F},fade=t=out:st={d - F:.2f}:d={F}"


def lancer(args):
    subprocess.run([FFMPEG, "-v", "error", "-y", *args], check=True)


def carte(png, duree, sortie):
    lancer(["-loop", "1", "-t", str(duree), "-i", str(png),
            "-f", "lavfi", "-t", str(duree), "-i", "anullsrc=r=48000:cl=stereo",
            "-vf", f"fps=30,scale=1280:720,setsar=1,format=yuv420p,{FONDU_V(duree)}",
            "-shortest", *ENCODAGE, str(sortie)])


def extrait(video, etiquette, duree, sortie):
    graphe = (f"[0:v]trim=0:{duree},setpts=PTS-STARTPTS,fps=30,scale=1280:720,setsar=1[b];"
              f"[b][1:v]overlay=0:0:shortest=1,format=yuv420p,{FONDU_V(duree)}[v];"
              f"[0:a]atrim=0:{duree},asetpts=PTS-STARTPTS,loudnorm=I=-18:TP=-2:LRA=11,"
              f"aresample=48000,afade=t=in:d=0.2,afade=t=out:st={duree - F:.2f}:d={F}[a]")
    lancer(["-i", str(video), "-loop", "1", "-t", str(duree), "-i", str(etiquette),
            "-filter_complex", graphe, "-map", "[v]", "-map", "[a]", "-t", str(duree),
            *ENCODAGE, str(sortie)])


travail = DEMO / "montage" / "parties"
travail.mkdir(parents=True, exist_ok=True)
parties = [travail / n for n in ("1_titre.mp4", "2_vo.mp4", "3_vf.mp4", "4_fin.mp4")]
carte(CARTES / "titre.png", T_TITRE, parties[0])
extrait(VO, CARTES / "vo.png", T_VO, parties[1])
extrait(VF, CARTES / "vf.png", T_VF, parties[2])
carte(CARTES / "fin.png", T_FIN, parties[3])

liste = travail / "liste.txt"
liste.write_text("".join(f"file '{p.as_posix()}'\n" for p in parties), encoding="utf-8")
SORTIE.parent.mkdir(parents=True, exist_ok=True)
lancer(["-f", "concat", "-safe", "0", "-i", str(liste), "-c", "copy", "-movflags", "+faststart", str(SORTIE)])

# affiche : une image de la partie française (avec son étiquette et le sous-titre)
t_affiche = T_TITRE + T_VO + 8.0
lancer(["-ss", str(t_affiche), "-i", str(SORTIE), "-frames:v", "1", "-q:v", "3", str(AFFICHE)])
print("ok", SORTIE, SORTIE.stat().st_size, "octets ;", AFFICHE)
