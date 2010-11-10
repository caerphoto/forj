# Nothing fancy in here - most actions just return JSON data

def get_user_details(user)
    if current_user.admin?
        result = { :user_type => user.admin? ? "A" : "N" }
    else
        result = {}
    end

    unless user.nil?
        result.merge!({
            :name => user.name,
            :email => user.email,
            :id => user.id,
            :joined => user.created_at.to_s
        })
    else
        result.merge!({
            :name => "(unknown)",
            :email => "(unknown email)",
            :id => 0,
            :joined => "(unknown join date)"
        })
    end
end

class UsersController < ApplicationController
    def show
        user = User.find(params[:id])

        result = get_user_details(user)

        render :json => result.to_json
    end

    def index
        allusers = User.all

        result = []

        allusers.each do |user|
            result.push get_user_details(user)
        end
        render :json => result.to_json
    end

  def new
  end

end
