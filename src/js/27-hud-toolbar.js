// ======================================================================
// HUD TOP-RIGHT LAYOUT
// Keep Twitch status, sound, and HOST controls together as one toolbar.
(function alignHudControls(){
  const style=document.createElement('style');
  style.textContent=`
    #tr{
      position:fixed!important;
      top:calc(18px + env(safe-area-inset-top,0px))!important;
      right:max(22px,env(safe-area-inset-right,0px))!important;
      left:auto!important;
      z-index:6!important;
      display:flex!important;
      align-items:center!important;
      justify-content:flex-end!important;
      gap:8px!important;
      width:auto!important;
      max-width:calc(100vw - 44px);
      pointer-events:auto!important;
    }
    #tr #btnPad{
      position:static!important;
      inset:auto!important;
      flex:none;
      margin:0;
    }
    #tr #status{min-width:0;max-width:min(420px,45vw);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #tr #btnSnd,#tr #btnPad{flex:none;white-space:nowrap}
    #standings{top:calc(76px + env(safe-area-inset-top,0px))!important}
    @media(max-width:860px){
      #tr{
        top:calc(12px + env(safe-area-inset-top,0px))!important;
        right:max(12px,env(safe-area-inset-right,0px))!important;
        left:auto!important;
        gap:5px!important;
        max-width:calc(100vw - 24px);
      }
      #tr #status{max-width:clamp(88px,30vw,190px);padding:7px 9px;font-size:10px}
      #tr #btnSnd{padding:7px 9px;font-size:10px}
      #tr #btnPad{min-width:80px;min-height:38px;padding:8px 12px;font-size:11px}
      #standings{top:calc(66px + env(safe-area-inset-top,0px))!important}
    }
    @media(max-width:390px){
      #tr{gap:4px!important}
      #tr #status{max-width:100px}
      #tr #btnSnd{padding-inline:7px;letter-spacing:.08em}
      #tr #btnPad{min-width:66px;padding-inline:8px;letter-spacing:.1em}
    }
  `;
  document.head.append(style);
})();
