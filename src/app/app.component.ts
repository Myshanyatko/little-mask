import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LtlMaskDirective } from '../../projects/ltl-mask/ltl-mask.directive';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, FormsModule, LtlMaskDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'little-mask';
  // mask = '999a{2}?{2}';
  mask = /[0-9a-zA-Z_.\\-]{2,50}[@]{1}[0-9a-zA-Z_./-]{2,50}[.]{1}[a-zA-Z]{2,5}/
  model = ''
}
