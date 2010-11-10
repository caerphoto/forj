# Nothing fancy in here - most actions just return JSON data

def get_basic_user_details(user)
    unless user.nil?
        result = {
            :name => user.name,
            :id => user.id,
        }
    else
        result = {
            :name => "(unknown)",
            :id => 0,
        }
    end
end

def get_full_user_details(user)
    if user.nil?
        return nil
    else
        result = get_basic_user_details(user)
        if current_user.admin?
            result.merge!({
                :user_type => user.admin? ? "A" : "N",
                :email => user.email
            })
        end
        return result
    end
end

class UsersController < ApplicationController
    def show
        user = User.find(params[:id])

        result = get_full_user_details(user)

        render :json => result.to_json
    end

    def index
        allusers = User.all

        result = []

        allusers.each do |user|
            result.push get_basic_user_details(user)
        end
        render :json => result.to_json
    end

  def new
  end

end
