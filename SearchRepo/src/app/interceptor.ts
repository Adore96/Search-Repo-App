import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {AuthService} from 'src/app/service/auth/auth.service';
import {catchError, map} from 'rxjs/operators';
import {
  CODE_BAD_REQUEST,
  CODE_INACTIVE_USER,
  CODE_INVALID_SEQUENCE_ID,
  CODE_NOT_FOUND,
  CODE_REQUEST_INVALID_FIRST_TIME_LOGIN,
  CODE_REQUEST_INVALID_MIGRATED_USER,
  CODE_REQUEST_INVALID_PASSWORD_EXPIRED,
  CODE_REQUEST_INVALID_TEMP_PASSWORD_SENT,
  CODE_REQUEST_INVALID_USERSESSION,
  CODE_REQUEST_SESSION_NOT_FOUND,
  CODE_REQUEST_TIMEOUT,
  CODE_REQUEST_UNAUTHORIZED,
  CODE_UNAUTHORIZED_REQUEST,
  CODE_USER_DEVICE_NOT_ACTIVE,
  MESSAGE_BAD_REQUEST,
  MESSAGE_INACTIVE_USER,
  MESSAGE_INVALID_SEQUENCE_ID,
  MESSAGE_NOT_FOUND,
  MESSAGE_REQUEST_INVALID_FIRST_TIME_LOGIN,
  MESSAGE_REQUEST_INVALID_MIGRATED_USER,
  MESSAGE_REQUEST_INVALID_PASSWORD_EXPIRED,
  MESSAGE_REQUEST_INVALID_TEMP_PASSWORD_SENT,
  MESSAGE_REQUEST_INVALID_USERSESSION,
  MESSAGE_REQUEST_TIMEOUT,
  MESSAGE_REQUEST_UNAUTHORIZED,
  MESSAGE_UNAUTHORIZED_REQUEST,
  MESSAGE_USER_DEVICE_NOT_ACTIVE,
  VERSION
} from 'src/app/utility/varlist/codeVarlist';
import {LoadingscreenService} from 'src/app/service/loading/loadingscreen.service';
import {ToastService} from 'src/app/service/toast/toast.service';
import {SERVICE_UNAVAILABLE} from '../utility/varlist/messageVarlist';
import {Router} from '@angular/router';
import {CODE_REQUEST_INVALID_CORSPOLICY, IB_ENABLE_ENCRYPRTION, MESSAGE_REQUEST_INVALID_CORSPOLICY} from '../utility/varlist/codeVarlist';
import {EncryptionService} from '../service/encryption/encryption.service';

/**
 * @author suren_v
 */

@Injectable()
export class EDBSInterceptor implements HttpInterceptor {
  activeRequests: number = 0;

  constructor(
    public auth: AuthService,
    public encryptionService: EncryptionService,
    public router: Router
  ) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = request.clone({
      setHeaders: {
        token: `${this.auth.getToken()}`
      }
    });

    return next.handle(request).pipe(
      map(event => {
          if (event instanceof HttpResponse) {
            this.activeRequests--;
            if (this.activeRequests === 0) {
              this.loadingService.stopLoading();
            }
            if (event['headers'].get('token') && this.auth.getToken()) {
              this.auth.updateToken(event['headers'].get('token'));
              this.auth.updateSequenceId(event['headers'].get('sequenceid'));
            }
            return event;
          }
        },
        error => {
          if (error instanceof HttpErrorResponse) {
            if (error['headers'].get('token') && this.auth.getToken()) {
              this.auth.updateToken(error['headers'].get('token'));
            }
            if (error.status === 0) {
              this.auth.logout();
            }
          }
        }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 0) {
          this.auth.logout();
        }
        return throwError(error);
      })
    );
  }
}
