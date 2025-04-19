# HSLink Nexus

HSLink Nexus is a simple tool that allows you to config HSLink.

## Road map

* [x] Config your HSLink
* [ ] Upgrade your HSLink
* [ ] Flash MCU via HSLink
* [ ] Config offline Flash (need HSLink update)

## How to build

* make sure you have a pnpm installed, or install it
* run `pnpm install`
* run `pnpm tauri build`

## Linux udev rules

If you are using a repository-compiled deb or rpm package, you need to install 99-hslink.rules manually.

```bash
cd /usr/lib/hslink-nexus
sudo install -Dvm644 99-hslink.rules -t /usr/lib/udev/rules.d/ 
```

If rules fail to reload automatically, you can refresh udev rules with the command "udevadm control --reload"

Reload udev rules after rules file change:

```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

The device group for newer versions of Linux such as Arch is `uucp`.

```bash
sudo usermod -aG uucp $USER
# or
sudo gpasswd -a $USER uucp
```

Older Linux device groups such as Ubuntu are `plugdev`

```bash
sudo usermod -aG plugdev $USER
# or
sudo gpasswd -a $USER plugdev
```

### Arch Linux

Arch Linux can install the hslink-nexus release via [AUR](https://aur.archlinux.org/packages/hslink-nexus) or [self-sourcing](https://github.com/taotieren/aur-repo).

```bash
yay -Syu hslink-nexus
```

Arch Linux can install the hslink-nexus development package via the [AUR](https://aur.archlinux.org/packages/hslink-nexus-git).

```bash
yay -Syu hslink-nexus-git
```

### Debian or  Ubuntu etc

```bash
pnpm install
pnpm tauri build -b deb
dpkg -i hslink-nexus*.deb
```


### RHEL / Fedora etc

```bash
pnpm install
pnpm tauri build -b rpm
rpm -ivh hslink-nexus*.rpm
```

