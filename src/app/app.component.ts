import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LtlMaskDirective } from '../../projects/ltl-mask/src/lib/ltl-mask.directive';

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, FormsModule, LtlMaskDirective],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'little-mask';
  // mask = '999a{2}?{2}';
  // mask = /[0-9]{2,50}@{1}[a-zA-Z]{2,50}\.{1}[u]{2,5}/
  // mask = /[0-9a-zA-Z_.\\-]{2,50}@{1}[0-9a-zA-Z_./-]{2,50}\.{1}[a-zA-Z]{2,5}/
  // mask = /\d{1,2}\w{2}\s{3,5}/
  // mask = /i{2,3}g{1,2}/
  mask = [/\d{25}/, /\w{20}/]
  // mask = /\w{250}/
  // mask = ['00', 'aaa', '???']
  model = ''
}
