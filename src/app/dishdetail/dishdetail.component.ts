import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { Params, ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Dish } from "../shared/dish";
import { Comment } from "../shared/comment";
import { DishService } from "../services/dish.service";
import { switchMap } from "rxjs/operators";
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  animations: [
    trigger('visibility', [
        state('shown', style({
            transform: 'scale(1.0)',
            opacity: 1
        })),
        state('hidden', style({
            transform: 'scale(0.5)',
            opacity: 0
        })),
        transition('* => *', animate('0.5s ease-in-out'))
    ])
  ]
})
export class DishdetailComponent implements OnInit {

  @ViewChild('cform') commentFormDirective;
  commentForm!: FormGroup;
  dish!: Dish;
  dishcopy!: Dish;
  dishIds!: string[];
  prev!: string;
  next!: string;
  comment!: Comment;
  comments!: Comment[];
  errMess!: string;

  visibility = 'shown';

  formErrors = {
    'author': '',
    'comment': '',
  };

  validationMessages = {
    'author': {
      'required': 'Author Name is required.',
      'minlength': 'Author Name must beat least 2 characters long.',
      'maxlength': 'Author Name cannot be more than 25 characters.'
    },
    'comment': {
      'required': 'Comment is required.'
    }
  }

  constructor(private dishService: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private c: FormBuilder,
    @Inject ('BaseURL') public BaseURL) {
      this.createForm();
    }

  ngOnInit(): void {
    this.dishService.getDishId()
      .subscribe((dishIds) => this.dishIds = dishIds);
      this.route.params.pipe(switchMap((params: Params) => { this.visibility = 'hidden'; return this.dishService.getDish(params['id']); }))
        .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
          errmess => this.errMess = <any>errmess);
  }

  createForm() {
    this.commentForm = this.c.group({
      author: ['', [Validators.required,
                       Validators.minLength(2),
                       Validators.maxLength(25)]],
      rating: '5',
      comment: ['', [Validators.required]],
      date: '',
    });

    this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); // (re)set form validation messages
  }

  onValueChanged(data?: any) {
    if (!this.commentForm) { return; }
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
  }

  onSubmit() {
    this.comment = this.commentForm.value;
    this.comment['date'] = new Date().toISOString();
    console.log(this.comment);
    this.dishcopy.comments.push(this.comment);
    this.dishService.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
      errmess => { this.dish; this.dishcopy; this.errMess = <any>errmess; });
    this.commentForm.reset({
      author: '',
      rating: '5',
      comment: '',
    });
    this.commentFormDirective.resetForm();
  }

  setPrevNext(dishId: string): void {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1 ) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1 ) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }
}
