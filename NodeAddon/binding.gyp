{
  "targets": [
    {
      "target_name": "GwentAddon",
      "sources": [
        "./addon_src.cpp",
        "./GwentAddon.cpp",
        "../GwentLibTestPlatform/Logging.cpp",
        # "../GwentLibTestPlaform/User.cpp",
        # "../GwentLibTestPlaform/Platform.cpp",
        "../GwentLib/Action.cpp",
        "../GwentLib/Board.cpp",
        "../GwentLib/Card.cpp",
        "../GwentLib/CardIdGenerator.cpp",
        "../GwentLib/Deck.cpp",
        "../GwentLib/Effect.cpp",
        "../GwentLib/Game.cpp",
        "../GwentLib/Graveyard.cpp",
        "../GwentLib/Hand.cpp",
        "../GwentLib/LeaderCard.cpp",
        "../GwentLib/Player.cpp",
        "../GwentLib/Row.cpp",
        "../GwentLib/SpecialCard.cpp",
        "../GwentLib/UnitCard.cpp" ],
      "include_dirs" : [ "../GwentLib", "../GwentLibTestPlatform" ],
      "cflags": ["-fexceptions", "-std=c++14"],
      "cflags_cc": ["-fexceptions", "-std=c++14"],
      "OTHER_CPLUSPLUSFLAGS" : ["-std=c++14", "-stdlib=libc++", "-fexceptions"]
    }
  ]
}
