export const openExternal = {
  steam: (appId) => {
    window.location.href = `steam://store/${appId}`;
    setTimeout(() => {
      if (document.hasFocus()) {
        window.open(`https://store.steampowered.com/app/${appId}`, '_blank');
      }
    }, 1500);
  },

  epic: (url) => {
    const epicProtocol = url.replace('https://store.epicgames.com', 'com.epicgames.launcher://store');
    window.location.href = epicProtocol;
    setTimeout(() => {
      if (document.hasFocus()) {
        window.open(url, '_blank');
      }
    }, 1500);
  },

  discord: (inviteCode) => {
    window.location.href = `discord://discord.com/invite/${inviteCode}`;
    setTimeout(() => {
      if (document.hasFocus()) {
        window.open(`https://discord.gg/${inviteCode}`, '_blank');
      }
    }, 1500);
  }
};
