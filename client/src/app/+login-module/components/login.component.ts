declare var require: any;

import {
  Component,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import {
  Apollo,
  ApolloQueryObservable,
} from 'apollo-angular';
import { MutationOptions } from 'apollo-client'
import {
  ApolloQueryResult,
  ApolloError
} from 'apollo-client';
import { DocumentNode } from 'graphql';
import { Subject } from 'rxjs/Subject';
import {
  Observable,
  Subscriber,
  Observer,
} from 'rxjs';
import { take } from "../../../../node_modules/rxjs/operator/take";

import { tokenNotExpired } from 'angular2-jwt';
import { JwtHelper } from 'angular2-jwt';


import { ValidationService } from 'app/control-module/services/validation.service';
import { AuthService } from 'app/app-module/services/auth.service';
import { LoginMutation } from '../../../graphql/schema';
import { AppMessagesComponent } from '../../control-module/components/control/messages/messages.component';


// todo figure out how to refactor this to not use require
const LoginMutationNode: DocumentNode =
  require('graphql-tag/loader!../../../graphql/Login.graphql');

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {

  public form: FormGroup;
  public usernameOrEmail: FormControl;
  public password: FormControl;

  constructor(private formBuilder: FormBuilder, private apollo: Apollo) {
    this.initForm();
  }

  initForm() {
    this.usernameOrEmail = new FormControl('', Validators.required);
    this.password = new FormControl('', ValidationService.passwordValidator);

    this.form = new FormGroup({
      usernameOrEmail: this.usernameOrEmail,
      password: this.password,
    });
  }

  getLoginObserver(): Observer<ApolloQueryResult<LoginMutation>> {
    const next = ({ data }) => {
      console.log('logged in user', data);
      AuthService.setJwtToken(data.login.token);
    };
    const error = (error) => {
      if (error instanceof ApolloError) {
        const errorMessages =
          error.graphQLErrors.map((graphqlError) => graphqlError.message);
        if (errorMessages.includes('loginFailed')) {
          this.form.setErrors({ loginFailed: true });
        }
      }
      console.log('keys', Object.keys(this.form.controls));
      console.log('there was an error sending the query', error);
    };
    const complete = () => console.log('complete');
    return { next, error, complete };
  }

  getLoginMutationOptions(): MutationOptions {
    return {
      mutation: LoginMutationNode,
      variables: {
        usernameOrEmail: this.form.value.usernameOrEmail,
        password: this.form.value.password,
      },
    };
  }

  submit() {
    this.apollo.mutate<LoginMutation>(
      this.getLoginMutationOptions()
    )
      .subscribe(this.getLoginObserver());
  }

}
