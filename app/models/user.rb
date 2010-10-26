class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :token_authenticatable, :confirmable, :lockable and :timeoutable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :name, :sig, :email, :password, :password_confirmation,
    :remember_me

    has_many :posts
    has_many :msg_threads
    validates :email,
        :presence => true,
        :uniqueness => { :case_sensitive => false }
    validates :name,
        :presence => true,
        :uniqueness => { :case_sensitive => false }
end
