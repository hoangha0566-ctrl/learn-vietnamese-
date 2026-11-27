// Danh sách game: "type" trong file dữ liệu → component.
// Muốn thêm game mới: viết component nhận { config, game } rồi thêm vào đây.
import type { ComponentType } from 'react';
import type { GameProps } from './GameHost';
import { DirectionMap } from './DirectionMap';
import { DressUp } from './DressUp';
import { ReviewBoard } from './ReviewBoard';
import {
  ArgueBack,
  Clinic,
  FamilyAlbum,
  HideAndSeek,
  JobFair,
  NameParty,
  NeighbourChat,
  PassportCheck,
  PoliteReply,
  QuickCount,
  SpyCamera,
  TalentTeam,
  TimeMachine,
  WhoIsWe,
} from './simple';
import {
  AddressDelivery,
  DailyRoutine,
  DurationBar,
  FamilyTree,
  MagicClock,
  MarketShopping,
  NumberBingo,
  RestaurantOrder,
  TicketBooking,
  TripCalendar,
} from './more';

export const GAMES: Record<string, ComponentType<GameProps>> = {
  'name-party': NameParty,
  'polite-reply': PoliteReply,
  'passport-check': PassportCheck,
  'family-album': FamilyAlbum,
  'job-fair': JobFair,
  'spy-camera': SpyCamera,
  'address-delivery': AddressDelivery,
  'talent-team': TalentTeam,
  'number-bingo': NumberBingo,
  'magic-clock': MagicClock,
  'daily-routine': DailyRoutine,
  'market-shopping': MarketShopping,
  'hide-and-seek': HideAndSeek,
  'quick-count': QuickCount,
  'time-machine': TimeMachine,
  'trip-calendar': TripCalendar,
  'duration-bar': DurationBar,
  'direction-map': DirectionMap,
  'argue-back': ArgueBack,
  'ticket-booking': TicketBooking,
  'dress-up': DressUp,
  'neighbour-chat': NeighbourChat,
  'family-tree': FamilyTree,
  'who-is-we': WhoIsWe,
  'restaurant-order': RestaurantOrder,
  'review-board': ReviewBoard,
  clinic: Clinic,
};
