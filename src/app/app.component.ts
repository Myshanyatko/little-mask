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

  model = ''
}
