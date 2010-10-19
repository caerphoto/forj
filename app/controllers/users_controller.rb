# Nothing fancy in here - most actions just return JSON data

def get_user_info(user)
    { :name => user.name, :email => user.email, :joined => user.created_at }
end

class UsersController < ApplicationController

    def show
        user = User.find(params[:id])

        result = get_user_info(user)

        render :json => result.to_json, :callback => params[:callback]
    end

    def index
        allusers = User.all

        result = []

        allusers.each do |user|
            result.push get_user_info user
        end
        render :json => result.to_json, :callback => params[:callback]
    end

  def new
  end

end
