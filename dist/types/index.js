"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Team = exports.LolRole = exports.TftMode = exports.LolMode = exports.GameType = void 0;
var GameType;
(function (GameType) {
    GameType["LOL"] = "lol";
    GameType["TFT"] = "tft";
})(GameType || (exports.GameType = GameType = {}));
var LolMode;
(function (LolMode) {
    LolMode["SUMMONERS_RIFT"] = "summoners_rift";
    LolMode["ARAM"] = "aram";
})(LolMode || (exports.LolMode = LolMode = {}));
var TftMode;
(function (TftMode) {
    TftMode["SOLO"] = "solo";
    TftMode["DOUBLE"] = "double";
})(TftMode || (exports.TftMode = TftMode = {}));
var LolRole;
(function (LolRole) {
    LolRole["TOP"] = "top";
    LolRole["JUNGLE"] = "jungle";
    LolRole["MID"] = "mid";
    LolRole["ADC"] = "adc";
    LolRole["SUPPORT"] = "support";
})(LolRole || (exports.LolRole = LolRole = {}));
var Team;
(function (Team) {
    Team["BLUE"] = "blue";
    Team["RED"] = "red";
})(Team || (exports.Team = Team = {}));
