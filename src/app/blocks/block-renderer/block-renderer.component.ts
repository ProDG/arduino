import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  AsideComponent,
  BodyComponent,
  CodeBlockComponent,
  DiffComponent,
  FigureCaptionComponent,
  FigureComponent,
  HeadingComponent,
  LedeComponent,
  PinoutComponent,
} from '@arduino/core-ui';
import type { Block } from '../../../content/models/block';

@Component({
  selector: 'app-block-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgOptimizedImage,
    HeadingComponent,
    BodyComponent,
    LedeComponent,
    AsideComponent,
    FigureComponent,
    FigureCaptionComponent,
    CodeBlockComponent,
    DiffComponent,
    PinoutComponent,
  ],
  template: `
    @switch (block().type) {
      @case ('heading') {
        <ui-heading [level]="$any(block()).level" [id]="$any(block()).id">{{
          $any(block()).text
        }}</ui-heading>
      }
      @case ('paragraph') {
        <ui-body [innerHTML]="$any(block()).html"></ui-body>
      }
      @case ('lede') {
        <ui-lede [innerHTML]="$any(block()).html"></ui-lede>
      }
      @case ('aside') {
        <ui-aside [variant]="$any(block()).variant" [innerHTML]="$any(block()).html"></ui-aside>
      }
      @case ('figure') {
        <ui-figure [number]="$any(block()).number" [fullBleed]="$any(block()).fullBleed">
          <img
            [ngSrc]="$any(block()).src"
            [width]="$any(block()).width"
            [height]="$any(block()).height"
            [alt]="$any(block()).alt"
            [priority]="isFirstFigure()"
            [loading]="isFirstFigure() ? 'eager' : 'lazy'"
          />
          @if ($any(block()).captionHtml) {
            <ui-figure-caption [innerHTML]="$any(block()).captionHtml"></ui-figure-caption>
          }
        </ui-figure>
      }
      @case ('code') {
        <ui-code-block
          [language]="$any(block()).language"
          [code]="$any(block()).code"
          [tokens]="$any(block()).tokens"
          [annotations]="$any(block()).annotations"
          [showLineNumbers]="$any(block()).showLineNumbers"
          [highlightLines]="$any(block()).highlightLines"
          [diffMode]="$any(block()).diffMode"
          [filename]="$any(block()).filename"
        ></ui-code-block>
      }
      @case ('diff') {
        <ui-diff [before]="$any(block()).before" [after]="$any(block()).after"></ui-diff>
      }
      @case ('pinout') {
        <ui-pinout
          [src]="$any(block()).src"
          [alt]="$any(block()).alt"
          [width]="$any(block()).width"
          [height]="$any(block()).height"
          [pins]="$any(block()).pins"
        ></ui-pinout>
      }
      @case ('sidenote') {
        <!-- intentionally empty: extracted by parent template -->
      }
      @case ('parts-list') {
        <!-- intentionally empty: extracted by parent template -->
      }
    }
  `,
  styles: [':host { display: contents; }'],
})
export class BlockRendererComponent {
  block = input.required<Block>();
  isFirstFigure = input(false);
}
