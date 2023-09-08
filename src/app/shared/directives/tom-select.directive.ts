import {AfterViewInit, Directive, ElementRef, Input} from '@angular/core';
import TomSelect from "tom-select";

@Directive({
  selector: 'select[tom-select]'
})
export class TomSelectDirective implements AfterViewInit {

  @Input() maxItems: number | null = 1;
  @Input() create: boolean = false;

  constructor(
    private readonly element: ElementRef<HTMLSelectElement>,
  ) {
  }

  public async ngAfterViewInit(): Promise<void> {
    new TomSelect(this.element.nativeElement, {
      create: this.create,
      maxItems: this.maxItems,
    });
  }

}
