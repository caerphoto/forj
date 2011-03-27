Forj::Application.routes.draw do
  devise_for :users

  get "pages/home"
  get "pages/about"
  get "pages/test"

  resources :users
  resources :posts
  resources :threads
  resources :folders
  resources :msg_threads

  match '/contact', :to => 'pages#contact'
  match '/about',   :to => 'pages#about'
  match "/signup",  :to => "users#new"
  match "/delete_post/:id", :to => "posts#destroy"
  match "/delete_thread/:id", :to => "msg_threads#destroy"
  match "/edit_post/:id", :to => "posts#edit"
  match "/edit_folder/:id", :to => "folders#edit"
  match "/edit_user/:id", :to => "users#edit"
  match "/delete_folder/:id", :to => "folders#destroy"

  root :to => "pages#home"
end
