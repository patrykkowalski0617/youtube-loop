import { type StatsReport, type Trend } from "../core";
import { t } from "../i18n";

import { countText, dayText, durationText, percentText, tempoText, timesText } from "./statsFormat";
import { statSection, type Tile, tile, tileGrid } from "./statTiles";

const trendText = (trend: Trend, format: (value: number) => string): string =>
  t.stats.trend(format(trend.current), format(trend.previous));

const edgesText = (report: StatsReport): string =>
  report.tempoEdges.last > 0
    ? t.stats.edges(tempoText(report.tempoEdges.first), tempoText(report.tempoEdges.last))
    : t.stats.none;

const practiceTiles = (report: StatsReport): Tile[] => [
  tile(t.stats.total, durationText(report.totalSeconds)),
  tile(t.stats.inRange, durationText(report.rangeSeconds)),
  tile(t.stats.today, durationText(report.todaySeconds)),
  tile(t.stats.perActiveDay, durationText(report.avgActiveDay)),
  tile(t.stats.activeDays, countText(report.activeDays)),
  tile(t.stats.streak, countText(report.streak.current)),
  tile(t.stats.longestStreak, countText(report.streak.longest)),
];

const repTiles = (report: StatsReport): Tile[] => [
  tile(t.stats.reps, countText(report.rangeReps)),
  tile(t.stats.repsTotal, countText(report.totalReps)),
  tile(t.stats.completion, percentText(report.completion)),
  tile(t.stats.aborted, countText(report.rangeAborted)),
  tile(t.stats.perRep, durationText(report.avgRep)),
  tile(t.stats.segment, durationText(report.avgSegment)),
];

const sessionTiles = (report: StatsReport): Tile[] => [
  tile(t.stats.sessions, countText(report.sessions)),
  tile(t.stats.perSession, durationText(report.avgSessionSeconds)),
  tile(t.stats.longestSession, durationText(report.longestSessionSeconds)),
];

const tempoTiles = (report: StatsReport): Tile[] => [
  tile(t.stats.bestTempoEver, timesText(report.bestTempoEver)),
  tile(t.stats.bestTempoRange, timesText(report.bestTempoRange)),
  tile(t.stats.targetTempo, timesText(report.targetTempo)),
  tile(t.stats.toTarget, percentText(report.tempoToTarget)),
  tile(t.stats.targetReached, dayText(report.targetReachedAt)),
  tile(t.stats.tempoEdges, edgesText(report)),
];

const otherTiles = (report: StatsReport): Tile[] => [
  tile(t.stats.watched, durationText(report.watchSeconds)),
  tile(t.stats.idle, durationText(report.idleSeconds)),
  tile(t.stats.abandoned, durationText(report.partialSeconds)),
];

const trendTiles = (report: StatsReport): Tile[] => [
  tile(t.stats.trendTime, trendText(report.secondsTrend, durationText)),
  tile(t.stats.trendReps, trendText(report.repsTrend, countText)),
  tile(t.stats.trendTempo, trendText(report.tempoTrend, timesText)),
];

export function statTileSections(report: StatsReport): HTMLElement[] {
  return [
    statSection(t.stats.sectionPractice, tileGrid(practiceTiles(report))),
    statSection(t.stats.sectionReps, tileGrid(repTiles(report))),
    statSection(t.stats.sectionSessions, tileGrid(sessionTiles(report))),
    statSection(t.stats.sectionTempo, tileGrid(tempoTiles(report))),
    statSection(t.stats.sectionOther, tileGrid(otherTiles(report))),
    statSection(t.stats.sectionTrend, tileGrid(trendTiles(report))),
  ];
}
