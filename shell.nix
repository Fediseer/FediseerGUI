{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
    nativeBuildInputs = with pkgs.buildPackages; [
      awscli
      git
      nodejs_18
      nodePackages.serverless
      nodePackages."@angular/cli"
      yarn
    ];
    shellHook = ''
      source <(ng completion script)
    '';
}
