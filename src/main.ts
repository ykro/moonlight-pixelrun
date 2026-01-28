import Phaser from 'phaser';
import { inject } from '@vercel/analytics';
import { GameConfig } from './game/GameConfig';

inject();

new Phaser.Game(GameConfig);
